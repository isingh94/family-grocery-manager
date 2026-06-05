"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getCurrentFamilyId } from "@/lib/helpers/getFamily";
import Navbar from "@/components/Navbar";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type InventoryItem = {
	  id: string;
	    item_name: string;
	      quantity: number;
	        unit: string;
};

export default function InventoryPage() {
	  const [items, setItems] = useState<InventoryItem[]>([]);
	 
	 async function consumeItem(
		  id: string,
		   currentQty: number
	 ) {
		  const newQty = Math.max(
			     0,
			        currentQty - 1
			         );

await supabase
  .from("inventory")
    .update({
	        quantity: newQty,
		  })
		    .eq("id", id);

		    if (newQty === 0) {
			      const familyId = await getCurrentFamilyId();

			        const currentItem = items.find(
					    (i) => i.id === id
					      );

					        if (familyId && currentItem) {
							    const { data: existing } = await supabase
							          .from("shopping_list")
								        .select("id")
									      .eq("family_id", familyId)
									            .eq("item_name", currentItem.item_name)
										          .eq("status", "pending");

											      if (!existing || existing.length === 0) {
												            await supabase
													            .from("shopping_list")
														            .insert({
																              family_id: familyId,
																	                item_name: currentItem.item_name,
																			          quantity: 1,
																				            unit: currentItem.unit,
																					              status: "pending",
																						                source: "system",
																								        });
																									    }
																									      }
		    }

		    loadInventory();

	 }  

	    async function loadInventory() {
		        const familyId = await getCurrentFamilyId();

			    if (!familyId) return;

			        const { data } = await supabase
				      .from("inventory")
				            .select("*")
					          .eq("family_id", familyId)
						        .order("item_name");

							    setItems(data || []);
							      }

							        useEffect(() => {
									    loadInventory();
									      }, []);

return (
	  <>
	      <Navbar />

	          <main className="p-6 max-w-4xl mx-auto">
		        <h1 className="text-3xl font-bold">
			        Inventory
				      </h1>

				            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					            {items.map((item) => (
							              <Card key={item.id}>
								                  <CardContent className="p-4">
										                <div>
												                <div className="text-lg font-semibold">
														                  {item.item_name}
																                  </div>

																		  <div className="text-sm text-muted-foreground">
																		    {item.quantity} {item.unit}
																		    </div>

																		    <div className="mt-2">
																		      {item.quantity <= 1 ? (
																			          <Badge variant="destructive">
																				        Low Stock
																					    </Badge>
																					      ) : (
																					          <Badge variant="outline">
																						        In Stock
																							    </Badge>
																							      )}
																			                    </div>
																							                  </div>

																										                <div className="flex items-center gap-2">
																												                <Button
																														                  onClick={() =>
																																	                      consumeItem(
																																				                            item.id,
																																							                          Number(item.quantity)
																																										                      )
																																												                        }
																																															                >
																																																	                  -1 Used
																																																			                  </Button>
																																																					                </div>
																																																							            </CardContent>
																																																								              </Card>
																																																									              ))}
																																																										            </div>
																																																											        </main>
																																																												  </>
);
}
